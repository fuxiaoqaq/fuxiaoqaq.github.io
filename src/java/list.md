---
title: List
---

:::danger
源代码基于JDK17
:::

## Vector
### 源码分析

```java
/**
 * 1.Vector 是线程安全的集合,多线程操作性能不高
 * 2.推荐使用JUC集合
 */
public class Vector<E>
        extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable {
    
    //用于存储集合中所有的数据对象
    protected Object[] elementData;

    //当前存储的数据数量
    protected int elementCount;

    /**
     * 1.表示每次扩容的大小,如果初始化时不进行设置,默认0,扩容时集合容量变为原容量的2倍
     * 2.如果初始化指定大小,例如20,每次扩容都是oldSize+20
     */
    protected int capacityIncrement;


    //指定集合大小以及扩容参数大小
    public Vector(int initialCapacity, int capacityIncrement) {
        super();
        if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal Capacity: " +
                    initialCapacity);
        //初始化赋值给创建的数组
        this.elementData = new Object[initialCapacity];
        //如果没有设置capacityIncrement,默认0,扩容规则 例如原始数组大小为10，扩容到20，为原数组大小的2倍
        this.capacityIncrement = capacityIncrement;
    }

    //指定集合大小
    public Vector(int initialCapacity) {
        this(initialCapacity, 0);
    }

    //使用无参构造器，默认初始化的数组大小为10的集合
    public Vector() {
        this(10);
    }
    
    public Vector(Collection<? extends E> c) {
        Object[] a = c.toArray();
        elementCount = a.length;
        if (c.getClass() == ArrayList.class) {
            elementData = a;
        } else {
            elementData = Arrays.copyOf(a, elementCount, Object[].class);
        }
    }

    /**
     * add方法触发扩容机制过程
     * 1.如果elementCount的当前值小于elementData.length的值时,不会触发扩容操作,直接在elementData[s] 索引处添加新的数据对象即可
     * 2.如果elementCount的当前值等于elementData.length的值时,就会触发扩容操作,需要调用grow()方法，申请新的扩容空间后,
     *   再执行elementData[s] 索引处添加新的数据对象即可
     */
    private void add(E e, Object[] elementData, int s) {
        if (s == elementData.length)
            elementData = grow();
        elementData[s] = e;
        elementCount = s + 1;
    }

    //setSize 触发扩容机制
    public synchronized void setSize(int newSize) {
        modCount++;
        // 如果新容量大于当前数组长度 就进行扩容操作
        if (newSize > elementData.length)
            grow(newSize);
        final Object[] es = elementData;
        // 如果新的容量小于当前数据长度 将之后的索引位置上的数据对象设置为null
        for (int to = elementCount, i = newSize; i < to; i++)
            es[i] = null;
        elementCount = newSize;
    }

    // 可以进行缩容操作
    public synchronized void trimToSize() {
        modCount++;
        int oldCapacity = elementData.length;
        // 进行缩容操作时，判断如果当前实际存储数据数量 小于 数组长度 进行缩容，反之不进行任何操作
        if (elementCount < oldCapacity) {
            elementData = Arrays.copyOf(elementData, elementCount);
        }
    }

    //具体扩容操作 最后把旧数据复制到新的扩容数组，然后赋值给 elementData 完成扩容操作
    private Object[] grow(int minCapacity) {
        int oldCapacity = elementData.length;
        int newCapacity = ArraysSupport.newLength(oldCapacity,
                minCapacity - oldCapacity, /* minimum growth */
                capacityIncrement > 0 ? capacityIncrement : oldCapacity
                /* preferred growth */);
        return elementData = Arrays.copyOf(elementData, newCapacity);
    }

}
```
### 初始化以及扩容总结
#### 1.使用无参构造器
:::warning
- 无参构造器初始化Vector，elementData.length默认为10，capacityIncrement默认为0。
- 当elementCount = 10，触发扩容操作，调用grow方法。
- 因为capacityIncrement不大于0，即preferred growth为elementData.length，扩容为elementData.length的2倍。
- 扩容规律为 10 -> 20 -> 40。
:::
#### 2.不使用无参构造器
:::warning
- 指定capacityIncrement，例如指定capacityIncrement=20，initialCapacity=20。
- 当elementCount = 20时触发扩容，调用grow方法。
- 因为capacityIncrement大于0，即preferred growth = 20。
- 扩容规律为 40 -> 60 -> 80，每次扩容都按照capacityIncrement的数值进行增量扩容。
:::
## 工具类
### Arrays.copyOf()
Arrays.copyOf(T[] original, int newLength)方法。 
该方法是一个工具性质的方法，主要用于将原始数组(original)复制为一个新的数组，后者的长度为指定的新长度(newLength)。 按照这样的描述，对于指定的新长度(newLength)，会出现以下两种情况。
- 指定的新长度(newLength)小于原始数组(original)的长度，那么原始数组(original)无法复制的部分会被抛弃。
- 指定的新长度(newLength)大于或等于原始数组(original)的长度，那么原始数组(original)中的所有数据对象(的引用)会按照原来的索引位被依次复制到新的数组中，新数组中多出来的空余部分会被填充为 null
### ArraysSupport.newLength(int oldLength, int minGrowth, int prefGrowth)
该方法同样是一个工具性质的方法，主要用于帮助数组在扩容前在不同的场景中找到 新的数组容量，并且防止新的数组容量超过系统规定的数组容量上限。该方法的参数如下。
- oldLength:扩容前的数组容量。
- minGrowth:最小的容量增量(必须为正数)。
- prefGrowth:常规的容量增量，该值需要大于 minGrowth 的值，否则会被忽略。

**在计算扩容后数组容量的过程中，如果 prefGrowth 的值大于 minGrowth 的值，则以prefGrowth 的值计算扩容后的新容量，否则以 minGrowth 的值计算扩容后的新容量。**
## ArrayList
### 源码分析
```java
// ArrayList 非线程安全集合
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable
{
    
    //默认初始化容量，在使用无参构造器创建ArrayList时
    private static final int DEFAULT_CAPACITY = 10;

    //使用有参构造器并且initialCapacity=0时，赋值给 elementData 
    private static final Object[]  EMPTY_ELEMENTDATA = {};

    //使用无参构造器,赋值给 elementData
    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};

    //用于存储数据的数组,transient修饰,自定义序列化
    transient Object[] elementData;

    //当前实际数据大小  
    private int size;

    //创建一个指定initialCapacity大小的数组,如果initialCapacity=0,相当于无参构造器创建一样
    public ArrayList(int initialCapacity) {
        if (initialCapacity > 0) {
            this.elementData = new Object[initialCapacity];
        } else if (initialCapacity == 0) {
            this.elementData = EMPTY_ELEMENTDATA;
        // 不支持initialCapacity为0     
        } else {
            throw new IllegalArgumentException("Illegal Capacity: "+
                    initialCapacity);
        }
    }
    //创建一个空数组,在第一次add添加数据的时候才会创建一个默认大小为10的数组
    public ArrayList() {
        this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
    }

    public ArrayList(Collection<? extends E> c) {
        Object[] a = c.toArray();
        if ((size = a.length) != 0) {
            if (c.getClass() == ArrayList.class) {
                elementData = a;
            } else {
                elementData = Arrays.copyOf(a, size, Object[].class);
            }
        } else {
            // replace with empty array.  
            elementData = EMPTY_ELEMENTDATA;
        }
    }
    //支持缩容
    public void trimToSize() {
        modCount++;
        if (size < elementData.length) {
            elementData = (size == 0)
                    ? EMPTY_ELEMENTDATA
                    : Arrays.copyOf(elementData, size);
        }
    }

    private void add(E e, Object[] elementData, int s) {
        if (s == elementData.length)
            elementData = grow();
        elementData[s] = e;
        size = s + 1;
    }
    // minCapacity = size + 1 
    private Object[] grow(int minCapacity) {
        int oldCapacity = elementData.length;
        if (oldCapacity > 0 || elementData != DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
            int newCapacity = ArraysSupport.newLength(oldCapacity,
                    minCapacity - oldCapacity, /* minimum growth */
                    oldCapacity >> 1           /* preferred growth */);
            return elementData = Arrays.copyOf(elementData, newCapacity);
        } else {
            return elementData = new Object[Math.max(DEFAULT_CAPACITY, minCapacity)];
        }
    }
}
```
### 初始化以及扩容总结
#### 1.使用无参构造器
:::warning
- 初始化一个容量为0的数组，即elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA。
- 当后续第一次执行添加操作会立即执行扩容操作调用grow方法，初始化一个默认为10的ArrayList集合。
- 后续当s == 10，也就是说默认长度为10的数组已经满数据，会进一步进行扩容。
- 满足条件oldCapacity > 0，执行扩容逻辑 oldCapacity >> 1 也就是 10/2，旧容量10 新容量15，相当于扩容为原数组大小的1.5倍。
:::
#### 2.不使用无参构造器
:::warning
- 会初始化一个容量为initialCapacity的数组。
- 如果initialCapacity=0，执行步骤相当于无参构造器的初始化扩容。
- 如果initialCapacity>0，会初始化一个容量为initialCapacity的数组，这时候第一次执行添加操作不会立即扩容操作。
- 当s == elementData.length触发扩容，如果指定初始化ArrayList大小，相当于比无参构造器少一次立即初始化的步骤 。
:::

## Vector与ArrayList对比
|      | Vector                                                 | ArrayList                                               |
|:-----|:-------------------------------------------------------|:--------------------------------------------------------|
| 内部结构 | 基于数组，初始化容量值默认10，使用者可以指定容量                              | 基于数组，默认初始化为0的空数组，第一次添加数据，会扩容到10，使用者也可以自定义初始化的值          |
| 扩容机制 | 默认扩容按照原数组的2倍进行扩容，可以指定扩容大小，即如果指定为20则每次扩容都按照原数组大小+20进行扩容 | 扩容按照原数组的1.5倍进行扩容,使用者不能干预扩容逻辑,除非扩容前容量小于10                |
| 线程安全 | 线程安全                                                   | 线程不安全                                                   |
| 序列化  | 没有对集合序列化做特殊优化处理,elementData多余的索引位会一起被序列化,造成不必要的性能消耗    | 对elementData序列化做了特殊处理,只对索引位有数据的进行序列化处理,未被使用的索引位,不做序列化操作 |

## Stack
### 源码分析
```java
/*
 * 1.LIFO栈结构，extend Vector，扩容规则同Vector，也不会对序列化和反序列化进行优化处理
 * 2.Stack 集合内部结构仍然是一个数组，使用数组的尾部模拟栈结构的栈顶，使用数组的头部模拟栈结构的栈底
 * 3.不推荐使用，如果需要栈结构，建议使用ArrayDeque
 */
public class Stack<E> extends Vector<E> {
    
    public Stack() {
    }

  
    public E push(E item) {
        addElement(item);

        return item;
    }

   
    public synchronized E pop() {
        E       obj;
        int     len = size();

        obj = peek();
        removeElementAt(len - 1);

        return obj;
    }

  
    public synchronized E peek() {
        int     len = size();

        if (len == 0)
            throw new EmptyStackException();
        return elementAt(len - 1);
    }

   
    public boolean empty() {
        return size() == 0;
    }

    
    public synchronized int search(Object o) {
        int i = lastIndexOf(o);

        if (i >= 0) {
            return size() - i;
        }
        return -1;
    }

   
    private static final long serialVersionUID = 1224463164541339165L;
}

```
## LinkedList
### 源码分析
```java
 /*
  * 1.LinkedList 集合同时实现了List和Queue集合的基本特性
  * 2.主要结构是双向链表，双向链表的节点不要求有连续的内存存储，即插入节点的时候不需要申请连续的存储空间
  * 3.不存在扩容操作
  */
public class LinkedList<E>
        extends AbstractSequentialList<E>
        implements List<E>, Deque<E>, Cloneable, java.io.Serializable {
    //当前链表的长度
    transient int size = 0;
    /*
     * first == null && last == null 表示双向链表没有任何数据对象
     * first == last 双向链表只有一个对象
     * first != null && last != null 表示双向链表至少有一个数据对象
     */
    //记录双向链表的头节点
    transient Node<E> first;
    //记录双向链表的尾节点
    transient Node<E> last;

    /*
    void dataStructureInvariants() {
        assert (size == 0)        ? (first == null && last == null)        : (first.prev == null && last.next == null);}
    */

    public LinkedList() {
    }

    public LinkedList(Collection<? extends E> c) {
        this();
        addAll(c);
    }

    private void linkFirst(E e) {
        // 使用一个临时变量记录操作前first属性中的信息
        final Node<E> f = first;
        // 创建一个数据信息为e的新节点，此节点的前置节点引用为null，后置节点引用指向原来的头节点
        final Node<E> newNode = new Node<>(null, e, f);
        // 这句很关键，由于要在双向链表的头部添加新的节点， 因此实际上会基于newNode节点将first属性中的信息进行重设置
        first = newNode;
        if (f == null)
            // 如果条件成立，则说明在进行添加操作时，双向链表中没有任何节点
            // 因此需要将双向链表中的last属性也指向新节点，让first属性和last属性指向同一个节点
            last = newNode;
        else
            // 如果条件不成立，则说明在操作前双向链表中至少有一个节点，
            // 因此只需将原来头节点的前置节点引用指向新的头节点newNode
            f.prev = newNode;
        // 双向链表长度 + 1
        size++;
        // LinkedList 集合的操作次数 + 1
        modCount++;
    }

    private E unlinkFirst(Node<E> f) {
        // assert f == first && f != null;
        // 定义一个element变量，用于记录当前双向链表头节点中的数据对象，以便方法最后将其返回
        final E element = f.item;
        // 创建一个next变量，用于记录当前双向链表头节点的后置节点引用。注意该变量的值可能为null
        final Node<E> next = f.next;
        f.item = null;
        f.next = null; // help GC
        // 设置双向链表中新的头节点为当前节点的后续节点
        first = next;
        // 如果条件成立，则说明在完成头节点的移除操作后，双向链表中已没有任何节点了
        // 需要同时将双向链表中的next变量和last属性值设置为null
        if (next == null)
            last = null;
        else
            // 在其他情况下，设置新的头节点的前置节点引用为null，因为原来的前置节点引用指向操作前的头节点
            next.prev = null;
        size--;
        modCount++;
        return element;
    }

    // add方法默认在尾节点之后添加新节点
    public boolean add(E e) {
        linkLast(e);
        return true;
    }

    // 默认头节点
    public void push(E e) {
        addFirst(e);
    }

    private static class Node<E> {
        //当前Node节点存储的具体的数据对象
        E item;
        //当前节点指向的下一个节点，尾节点的next永远为null
        Node<E> next;
        //当前节点指向的上一个节点，头节点的prev永远为null
        Node<E> prev;

        Node(Node<E> prev, E element, Node<E> next) {
            this.item = element;
            this.next = next;
            this.prev = prev;
        }
    }
}
```
## LinkedList与ArrayList对比
#### 1.写操作对比
:::warning
#### ArrayList写操作：
- 使用add在数据尾部添加新的数据对象时，数组中有多余容量可以直接添加操作，基本上没有时间消耗，时间复杂度O(1)。
- 当在尾部添加新的数据对象时，数组容量已满，会执行一次扩容操作，把新扩容的数据赋值给elementData 再进行添加数据。
- ArrayList写最差的情况是 一直在数组中的 0号索引位置一直使用add添加对象，这样的情况，每添加一个新对象，都会将当前数组的对象整体向后移动一个索引位置，并且在数据中没有多余容量的情况下，会先进行扩容，这个操作可以规避。
#### LinkedList写操作：
- 如果在双向链表的头节点以及尾节点中添加新的数据对象，只需要更改更节点或者尾节点的引用信息，在这种操作下，基本上没有时间消耗，时间复杂度O(1)。
- 如果不是在尾节点或者头节点，最坏情况下，无论是从双向链表的头节点开始查询，还是尾节点开始查询，找到正确索引位的时间复杂度都是O(n)。
:::
#### 2.读操作对比
:::warning
#### ArrayList读操作：
- 因为ArrayList支持随机访问，无论操作者是要遍历数组中的数据对象，还是指定索引位的数据对象，读操作的性能消耗都是相同的，时间复杂度均为O(1)。
#### LinkedList读操作：
- 如果操作者从双向链表的头节点或尾节点读取数据，那么由于头节点和尾节点分别有first属性和last属性进行标识，因此不存在查询过程的额外耗时，直接读取数据即可。
- 如果操作者并非在双向链表的头节点或尾节点读取数据，那么肯定存在查询过程，而查询过程都是依据节点间的引用关系遍历双向链表的。不过LinkedList集合对查 询过程做了一些优化处理。例如，根据当前指定的索引位是在双向链表的前半段，还是在双向链表的后半段，确定是从双向链表的头节点开始查询，还是从双向链表的尾节点开始查询，最差的情况是读取数据位于双向链表中部，这样无论是从头节点开始查询，还是尾节点开始查询，性能消耗都差不多。
- 总而言之，在双向链表中查询指定索引位上数据对象的平均时间复杂度为O(n)。
:::